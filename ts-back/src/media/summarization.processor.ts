import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaFile, MediaFileDocument } from './schemas/media-file.schema';
import { MediaGateway } from './media.gateway';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SummarizationJobData {
  fileId: string;
  userId: string;
}

@Processor('summarization', { concurrency: 2 })
export class SummarizationProcessor extends WorkerHost {
  private readonly logger = new Logger(SummarizationProcessor.name);
  private readonly summarizationServiceUrl: string;

  constructor(
    @InjectModel(MediaFile.name)
    private mediaFileModel: Model<MediaFileDocument>,
    private readonly mediaGateway: MediaGateway,
    private configService: ConfigService,
  ) {
    super();
    this.summarizationServiceUrl = this.configService.get<string>(
      'SUMMARIZATION_SERVICE_URL',
      'http://summarization:5001',
    );
  }

  async process(job: Job<SummarizationJobData>): Promise<void> {
    const { fileId, userId } = job.data;

    this.logger.log(`Processing summarization job for file ${fileId}`);

    try {
      // Get file from database
      const file = await this.mediaFileModel.findById(fileId).exec();

      if (!file) {
        throw new Error('File not found');
      }

      if (!file.transcribedText) {
        throw new Error('No transcribed text available');
      }

      this.logger.log(`Found file ${file.originalFilename} with transcribed text (${file.transcribedText.length} chars)`);

      // Update status to processing
      await this.updateSummaryStatus(fileId, userId, 'processing');

      // Call summarization service
      this.logger.log(`Calling summarization service at ${this.summarizationServiceUrl}`);
      
      const response = await axios.post(
        `${this.summarizationServiceUrl}/summarize`,
        {
          text: file.transcribedText,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 300000, // 5 minutes timeout
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Summarization failed');
      }

      const summaryText = response.data.summary;
      this.logger.log(`Summarization completed: ${summaryText.length} characters`);

      // Update file with summary
      const updatedFile = await this.mediaFileModel
        .findByIdAndUpdate(
          fileId,
          {
            summaryStatus: 'completed',
            summaryText,
          },
          { new: true },
        )
        .exec();

      if (!updatedFile) {
        throw new Error('Failed to update file with summary');
      }

      // Emit WebSocket event for completion
      this.mediaGateway.emitSummaryStatusUpdate(userId, {
        fileId: updatedFile._id.toString(),
        summaryStatus: 'completed',
        summaryText,
        originalFilename: updatedFile.originalFilename,
      });

      this.logger.log(`Summarization job completed for file ${fileId}`);
    } catch (error) {
      this.logger.error(`Summarization job failed for file ${fileId}: ${error.message}`, error.stack);

      // Update file with error
      const errorMessage = error.response?.data?.error || error.message || 'Summarization failed';
      
      await this.mediaFileModel
        .findByIdAndUpdate(
          fileId,
          {
            summaryStatus: 'error',
            summaryErrorMessage: errorMessage,
          },
          { new: true },
        )
        .exec();

      // Emit WebSocket event for error
      this.mediaGateway.emitSummaryStatusUpdate(userId, {
        fileId,
        summaryStatus: 'error',
        summaryErrorMessage: errorMessage,
      });

      throw error; // Re-throw to trigger job retry
    }
  }

  private async updateSummaryStatus(
    fileId: string,
    userId: string,
    summaryStatus: 'processing' | 'completed' | 'error',
  ): Promise<void> {
    const file = await this.mediaFileModel
      .findByIdAndUpdate(
        fileId,
        { summaryStatus },
        { new: true },
      )
      .exec();

    if (file) {
      this.mediaGateway.emitSummaryStatusUpdate(userId, {
        fileId: file._id.toString(),
        summaryStatus,
        originalFilename: file.originalFilename,
      });
    }
  }
}
