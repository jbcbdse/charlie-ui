import DetailsBlock from "./DetailsBlock";

type Props = {
  content: string;
  open?: boolean;
};

export default function Thoughts({ content, open }: Props) {
  return <DetailsBlock title="Thoughts" content={content} open={open} />;
}
