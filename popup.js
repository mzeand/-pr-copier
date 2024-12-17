document.getElementById("copy").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: getPullRequests,
        },
        (results) => {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
                document.getElementById("status").textContent = "Error occurred.";
                return;
            }

            if (results && results[0] && results[0].result) {
                const prData = results[0].result;

                if (prData.length === 0) {
                    document.getElementById("status").textContent = "No PRs found.";
                    return;
                }

                // リッチテキストに変換してクリップボードにコピー
                const richText = prData
                    .map(pr => `<p><a href="${pr.url}">${pr.title}</a></p>`)
                    .join("");

                navigator.clipboard.write([
                    new ClipboardItem({
                        "text/html": new Blob([richText], { type: "text/html" }),
                    }),
                ]).then(() => {
                    document.getElementById("status").textContent = "Copied!";
                }).catch(err => {
                    console.error("Clipboard error:", err);
                    document.getElementById("status").textContent = "Failed to copy.";
                });
            } else {
                document.getElementById("status").textContent = "No data returned.";
            }
        }
    );
});

// GitHubのPull Request一覧ページからPRタイトルとURLを取得する関数
function getPullRequests() {
    // GitHub Pull Request一覧ページでPRの情報が含まれる行を選択
    const prElements = document.querySelectorAll(".js-issue-row");

    // 各PRのタイトルとURLを配列にして返す
    const pullRequests = Array.from(prElements).map(pr => {
        const titleElement = pr.querySelector(".Link--primary");
        const url = titleElement ? titleElement.href : null;
        const title = titleElement ? titleElement.textContent.trim() : "Untitled";
        return { title, url };
    });

    return pullRequests;
}
