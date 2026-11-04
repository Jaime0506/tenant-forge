import { ComponentProps } from "react";
import SqlExecutionInspector from "./SqlExecutionInspector";

export default function SqlExecutionResults(props: ComponentProps<typeof SqlExecutionInspector>) {
  return <SqlExecutionInspector {...props} />;
}
