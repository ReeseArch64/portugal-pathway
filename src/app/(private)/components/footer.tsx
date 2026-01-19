"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="border-t bg-muted/40 mt-auto"
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="w-full flex items-center justify-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-center text-sm text-muted-foreground"
          >
            © {new Date().getFullYear()} Rumo Portugal. Código aberto. Criado
            por{" "}
            <motion.a
              href="https://github.com/reesearch64"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              Alan Guerra @ReeseArch64
            </motion.a>
          </motion.p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
