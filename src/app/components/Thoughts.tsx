type Props = {
  content: string;
  open?: boolean;
};

export default function Thoughts({ content, open }: Props) {
  if (!content) {
    return null;
  }
  return (
    <div className="flex justify-start my-2">
      <details
        className="max-w-3xl w-full bg-gray-100 text-gray-700 rounded-lg p-3"
        {...(open ? { defaultOpen: true } : {})}
      >
        <summary className="cursor-pointer text-xs font-semibold select-none">
          Thoughts
        </summary>
        <div className="mt-2 whitespace-pre-wrap text-sm opacity-90 max-h-48 overflow-y-auto">
          {content}
        </div>
      </details>
    </div>
  );
}
