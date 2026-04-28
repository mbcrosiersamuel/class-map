interface SubmitSuccessProps {
  isUpdate: boolean;
  onAnother: () => void;
}

export default function SubmitSuccess({ isUpdate, onAnother }: SubmitSuccessProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-gray-900 mb-2">
          {isUpdate ? 'Entry Updated!' : "You're on the Map!"}
        </h2>
        <p className="text-gray-500 font-sans text-sm mb-6">
          {isUpdate
            ? 'Your information has been updated successfully.'
            : 'Your pin has been placed. Check out the map to see where everyone is headed.'}
        </p>
        <button
          onClick={onAnother}
          className="px-6 py-2 bg-primary text-white font-sans text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Submit Another
        </button>
      </div>
    </div>
  );
}
