import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./ui-polish.css";
import "./ui-polish-pass2.css";
import "./ui-polish-pass3.css";
import "./ui-overview-polish.css";
import "./ui-product-polish.css";
import "./ui-final-polish.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
