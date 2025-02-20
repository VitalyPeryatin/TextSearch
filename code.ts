figma.showUI(__html__);

let timer = undefined;

figma.ui.onmessage = async message => {
  const node = figma.root
  node.type === 'DOCUMENT'
  if (message.query !== undefined) { // Тип сообщения: "Поиск нод"
    if (timer) {
      clearTimeout(timer);
    }
    if (message.query) {
      searchFor(message.query);
    }
  } else if (message.show) { // Тип сообщения: "Показать ноду"
    const node = await figma.getNodeByIdAsync(message.show);
    if (node.type === 'DOCUMENT' || node.type === 'PAGE') {
      return;
    }
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  } else if (message.quit) { // Тип сообщения: "Закрыть плагин"
    figma.closePlugin();
  }
}

function* walkTree(node) { // aka Kotlin Sequences
  yield node;
  const children = node.children;
  if (children) {
    for (const child of children) {
      yield* walkTree(child)
    }
  }
}

function searchFor(query) {
  query = query.toLowerCase()
  const walker = walkTree(figma.currentPage)

  function processOnce() {
    const results = [];
    let count = 0;
    let done = true;
    let res
    while (!(res = walker.next()).done) {
      const node = res.value
      if (node.type === 'TEXT') {
        const characters = node.characters.toLowerCase()
        if (characters.includes(query)) {
          results.push(node.id);
        }
      }
      if (++count === 1000) {
        done = false
        timer = setTimeout(processOnce, 20)
        break
      }
    }

    figma.ui.postMessage({ query, results, done })
  }

  processOnce()
}
