import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MediaService } from './media.service';
import { MediaGateway } from './media.gateway';
import axios from 'axios';
import FormData from 'form-data';
import * as fsSync from 'fs';
import { ConfigService } from '@nestjs/config';

export interface TranscriptionJobData {
  fileId: string;
  userId: string;
  filePath: string;
  originalFilename: string;
}

@Processor('transcription', {
  concurrency: 2, // Process 2 jobs concurrently
})
export class TranscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptionProcessor.name);
  private readonly transcriptionServiceUrl: string;

  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaGateway: MediaGateway,
    private readonly configService: ConfigService,
  ) {
    super();
    this.transcriptionServiceUrl = this.configService.get<string>(
      'TRANSCRIPTION_SERVICE_URL',
      'http://transcription:5000',
    );
  }

  async process(job: Job<TranscriptionJobData>): Promise<any> {
    const { fileId, userId, filePath, originalFilename } = job.data;
    this.logger.log(`Starting transcription for file ${fileId}`);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Update status to processing with 5% progress
      await this.mediaService.updateFileStatus(fileId, 'processing', 5);
      this.mediaGateway.emitFileStatusUpdate(userId, fileId, 'processing', 5);
      await job.updateProgress(5);

      // Update progress to 10% (validating file)
      await job.updateProgress(10);
      await this.mediaService.updateFileProgress(fileId, 10);
      this.mediaGateway.emitFileProgress(userId, fileId, 10);

      // Update progress to 15% (preparing file)
      await job.updateProgress(15);
      await this.mediaService.updateFileProgress(fileId, 15);
      this.mediaGateway.emitFileProgress(userId, fileId, 15);

      // Prepare form data with the audio file
      const formData = new FormData();
      const fileStream = fsSync.createReadStream(filePath);
      formData.append('file', fileStream, originalFilename);

      // Update progress to 20% (file prepared)
      await job.updateProgress(20);
      await this.mediaService.updateFileProgress(fileId, 20);
      this.mediaGateway.emitFileProgress(userId, fileId, 20);

      // Update progress to 25% (connecting to transcription service)
      await job.updateProgress(25);
      await this.mediaService.updateFileProgress(fileId, 25);
      this.mediaGateway.emitFileProgress(userId, fileId, 25);

      // Call transcription service
      this.logger.log(`Calling transcription service for file ${fileId}`);
      
      // Progress updates during transcription (30-85%)
      progressInterval = setInterval(async () => {
        const state = await job.getState();
        if (state === 'active') {
          const currentProgress = Math.min(85, ((job.progress as number) || 25) + 5);
          if (currentProgress <= 85) {
            await job.updateProgress(currentProgress);
            await this.mediaService.updateFileProgress(fileId, currentProgress);
            this.mediaGateway.emitFileProgress(userId, fileId, currentProgress);
          }
        }
      }, 2000); // Update every 2 seconds

      const response = await axios.post(
        `${this.transcriptionServiceUrl}/transcribe`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000, // 5 minutes timeout
        },
      );

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Transcription failed');
      }

      // Update progress to 90% (processing results)
      await job.updateProgress(90);
      await this.mediaService.updateFileProgress(fileId, 90);
      this.mediaGateway.emitFileProgress(userId, fileId, 90);

      // Update progress to 95% (saving results)
      await job.updateProgress(95);
      await this.mediaService.updateFileProgress(fileId, 95);
      this.mediaGateway.emitFileProgress(userId, fileId, 95);

      // Update file with transcribed text and completed status
      await this.mediaService.updateFileStatus(fileId, 'completed', 100);
      
      // Update the transcribed text separately
      const file = await this.mediaService.findById(fileId);
      if (file) {
        file.transcribedText = response.data.text;
        await file.save();
      }

      // Update progress to 100% (completed)
      await job.updateProgress(100);
      this.mediaGateway.emitFileStatusUpdate(userId, fileId, 'completed', 100);

      this.logger.log(`Successfully transcribed file ${fileId}`);

      return {
        success: true,
        fileId,
        text: response.data.text,
      };
    } catch (error) {
      this.logger.error(`Transcription failed for file ${fileId}:`, error);

      // Clear interval if it's still running
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      const errorMessage =
        error.response?.data?.error || error.message || 'Transcription failed';

      // Update status to error
      await this.mediaService.updateFileStatus(fileId, 'error', 0, errorMessage);
      this.mediaGateway.emitFileStatusUpdate(userId, fileId, 'error', 0, errorMessage);

      throw error; // Re-throw to mark job as failed
    }
  }
}
