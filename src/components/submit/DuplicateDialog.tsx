import type { Person } from '../../types';

interface DuplicateDialogProps {
  match: Person;
  submitting: boolean;
  onUpdate: () => void;
  onSubmitAsNew: () => void;
  onCancel: () => void;
}

export default function DuplicateDialog({
  match,
  submitting,
  onUpdate,
  onSubmitAsNew,
  onCancel,
}: DuplicateDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl text-gray-900 mb-2">Already on the map</h3>
        <p className="text-sm text-gray-600 mb-5">
          There's already a{' '}
          <span className="font-medium text-gray-900">{match.name}</span> on the map.{' '}
          Update their entry instead — you can add a second city there.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onUpdate}
            className="w-full py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Update their entry
          </button>
          <button
            type="button"
            onClick={onSubmitAsNew}
            disabled={submitting}
            className="w-full py-2.5 border border-gray-300 text-gray-700 font-sans text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit as new'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-gray-500 font-sans text-sm hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
