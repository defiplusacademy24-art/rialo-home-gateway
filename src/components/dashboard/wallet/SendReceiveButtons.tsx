import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface SendReceiveButtonsProps {
  onSend: () => void;
  onReceive: () => void;
}

const SendReceiveButtons = ({ onSend, onReceive }: SendReceiveButtonsProps) => {
  return (
    <div className="flex gap-3 mb-6">
      <button
        onClick={onSend}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 transition-colors font-medium text-sm"
      >
        <ArrowUpRight className="w-4 h-4" />
        Send
      </button>
      <button
        onClick={onReceive}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/15 hover:bg-white/25 transition-colors font-medium text-sm"
      >
        <ArrowDownLeft className="w-4 h-4" />
        Receive
      </button>
    </div>
  );
};

export default SendReceiveButtons;
