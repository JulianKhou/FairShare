interface CloseBtnProps {
  onClose: () => void;
}

export const CloseBtn = ({ onClose }: CloseBtnProps) => {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
};
