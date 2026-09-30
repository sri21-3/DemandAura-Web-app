import React from 'react';
import { MlErrorCategory, PipelineExecutionMeta } from '../types/models';

export interface PipelineErrorState {
  category: MlErrorCategory;
  message: string;
  statusCode?: number;
  endpoint?: string;
}

interface PipelineFlowStatusProps {
  loading: boolean;
  elapsedMs: number;
  isColdStart: boolean;
  error: PipelineErrorState | null;
  meta?: PipelineExecutionMeta | null;
  onRetry?: () => void;
  modelLabel?: string;
}

const ERROR_CATEGORY_LABELS: Record<
  MlErrorCategory,
  { title: string; subtitle: string }
> = {
  validation_error: {
    title: 'Selection Incomplete',
    subtitle: 'Please select a valid country and consumer category to continue.',
  },
  network_error: {
    title: 'Connection Delay',
    subtitle:
      'The intelligence service is taking longer than usual to respond. Please try again in a moment.',
  },
  backend_error: {
    title: 'Analysis Unavailable for Selection',
    subtitle:
      'We could not complete the analysis for this market combination right now.',
  },
  invalid_response: {
    title: 'Unexpected Data Format',
    subtitle:
      'The market analysis service returned an incomplete result. Please retry.',
  },
};

export const PipelineFlowStatus: React.FC<PipelineFlowStatusProps> = ({
  loading,
  elapsedMs,
  isColdStart,
  error,
  onRetry,
}) => {
  if (!loading && !error) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Service Wake-Up Notice when request takes longer than a few seconds */}
      {loading && isColdStart && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-amber-900">
              Preparing Market Intelligence Engine ({(elapsedMs / 1000).toFixed(0)}s)
            </div>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            The analysis service is warming up and loading the latest global
            market data. The first request after a period of inactivity may take
            15–40 seconds; subsequent analyses will complete almost instantly.
          </p>
        </div>
      )}

      {/* User-Friendly Error Alert */}
      {error && !loading && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm font-semibold text-red-950">
              {ERROR_CATEGORY_LABELS[error.category].title}
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-900 hover:bg-red-800 rounded-lg transition-colors cursor-pointer self-start whitespace-nowrap"
              >
                Try Again
              </button>
            )}
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            {ERROR_CATEGORY_LABELS[error.category].subtitle}
          </p>
        </div>
      )}
    </div>
  );
};
