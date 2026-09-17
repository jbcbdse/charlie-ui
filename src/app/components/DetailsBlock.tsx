type Props = {
  title: string;
  content: string;
  open?: boolean;
};

export default function DetailsBlock({ title, content, open }: Props) {
  if (!content) {
    return null;
  }
  return (
    <div className="flex justify-start my-2">
      <details
        className="max-w-3xl w-full text-gray-500 rounded-lg px-3 py-2"
        open={open}
      >
        <summary className="cursor-pointer text-xs select-none">
          {title}
        </summary>
        <div className="mt-2 whitespace-pre-wrap text-xs opacity-90 max-h-48 overflow-y-auto font-mono">
          {content}
        </div>
      </details>
    </div>
  );
}
