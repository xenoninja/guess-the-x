import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-900.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./styles.css";
import { renderRoute, routeForPath } from "./app";
import { createDuckDbFootballDataSource } from "./duckdbFootballDataSource";
import { EXPECTED_FOOTBALL_DATA_SUMMARY, loadFootballData } from "./footballData";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

void renderApp(root);

async function renderApp(rootElement: HTMLElement): Promise<void> {
  if (routeForPath(window.location.pathname) !== "football") {
    rootElement.innerHTML = renderRoute(window.location.pathname);
    return;
  }

  rootElement.innerHTML = renderRoute(window.location.pathname, { footballState: "loading" });

  try {
    const footballData = await loadFootballData(createDuckDbFootballDataSource(), {
      expectedSummary: EXPECTED_FOOTBALL_DATA_SUMMARY,
    });

    rootElement.innerHTML = renderRoute(window.location.pathname, {
      footballState: "ready",
      footballDataSummary: footballData.summary,
    });
  } catch {
    rootElement.innerHTML = renderRoute(window.location.pathname, { footballState: "error" });
    rootElement.querySelector("button")?.addEventListener("click", () => {
      void renderApp(rootElement);
    });
  }
}
