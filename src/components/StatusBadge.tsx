import { Status } from "../types/class";
import { getStatusColor } from "../lib/utils";

type Props = {
  status: Status;
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={getStatusColor(status)}>
      ● {status}
    </span>
  );
}