import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const ROOT_ELEMENT_ID = "root";
const rootElement = document.getElementById(ROOT_ELEMENT_ID);

if (!rootElement) {
  throw new Error(`Missing application root element: #${ROOT_ELEMENT_ID}`);
}

createRoot(rootElement).render(
  <StrictMode><App /></StrictMode>,
);
