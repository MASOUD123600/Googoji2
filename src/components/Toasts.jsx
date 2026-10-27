import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../store/AppContext";

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast ${t.type === "err" ? "toast-err" : ""}`}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            layout
          >
            <span>{t.type === "err" ? "⚠️" : "✅"}</span> {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
