const metas = [
  {
    type: "BoolLiteral",
    pattern: /^(true|false)/,
  },
  {
    type: "NullLiteral",
    pattern: /^(null)/,
  },
  {
    type: "NumberLiteral",
    pattern: /^(-?\d*\.?\d+)/,
  },
  {
    type: "StringLiteral",
    pattern: /^(".*?")/,
  },
  {
    type: "Symbol",
    pattern: /^(\[|]|\(|\)|\{|}|,|:)/,
  },
  {
    type: "Whitespace",
    pattern: /^(\s+)/,
  },
];
function tokenize(code) {
  const tokens = [];
  let rest = code;
  let lastRest = rest;
  while (rest !== "") {
    lastRest = rest;
    for (let i = 0; i < metas.length; i++) {
      const { type, pattern } = metas[i];
      const extracted = rest.match(pattern);
      if (extracted && extracted[1] !== "") {
        tokens.push({
          type,
          value: extracted[1],
        });
        rest = rest.substr(extracted[1].length);
        break;
      }
    }
    if (lastRest === rest) {
      throw new Error(`unknown token starts with ${rest}`);
    }
  }
  tokens.push({
    type: "EOF",
  });
  return tokens;
}
module.exports = {
  tokenize,
};
