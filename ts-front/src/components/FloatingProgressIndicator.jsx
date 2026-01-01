import { Icon } from '@iconify/react';

export default function FloatingProgressIndicator({ files }) {
  // Filter files that are currently processing (transcription or summarization)
  const processingFiles = files.filter(f => f.status === 'processing' || f.summaryStatus === 'processing');

  if (processingFiles.length === 0) {
    return null;
  }

  const getFileTaskInfo = (file) => {
    if (file.summaryStatus === 'processing') {
      return {
        task: 'Summarizing...',
        color: 'from-purple-500 to-pink-600',
        iconColor: 'text-purple-500',
      };
    }
    return {
      task: 'Transcribing...',
      color: 'from-blue-500 to-indigo-600',
      iconColor: 'text-blue-500',
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden w-80">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Icon icon="mdi:cog" className="animate-spin" width={20} />
            <span className="font-semibold">
              {processingFiles.length} file{processingFiles.length > 1 ? 's' : ''} processing
            </span>
          </div>
        </div>

        {/* Processing files list */}
        <div className="max-h-64 overflow-y-auto">
          {processingFiles.map((file) => {
            const taskInfo = getFileTaskInfo(file);
            const progress = file.summaryStatus === 'processing' ? 50 : (file.progress || 0);
            
            return (
              <div
                key={file.id}
                className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    icon={file.mimetype.startsWith('audio/') ? 'mdi:music' : 'mdi:video'}
                    width={24}
                    className={file.mimetype.startsWith('audio/') ? 'text-blue-500' : 'text-purple-500'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={file.originalFilename}>
                      {file.originalFilename}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{taskInfo.task}</span>
                        <span className="text-xs font-medium text-blue-600">
                          {progress !== undefined ? `${progress}%` : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`bg-gradient-to-r ${taskInfo.color} h-1.5 rounded-full transition-all duration-300 ease-out`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
