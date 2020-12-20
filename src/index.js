const tokenizer = require("../tokenizer");
const parser = require("../parser");
const transformer = require("../transformer");
const generator = require("../generator");

const code = `
{
  "str_key": "hello",
  "num_key": 0,
  "bool_key": true,
  "null_key": null,
  "arr_key": [1,2,3],
  "obj_key": {
    "str_key": "world",
    "num_key": 1,
    "bool_key": false,
    "null_key": null,
    "arr_key": [1,2,3],
  }
}`;

function main() {
  const tokens = tokenizer
    .tokenize(code)
    .filter((token) => token.type !== "Whitespace");
  console.log(tokens);
  // return;

  const ast = parser.parse(tokens);
  console.log(JSON.stringify(ast, null, 2));
  // return;

  const pluginA = {
    BoolLiteral(node) {
      node.value = !node.value;
    },
  };
  const pluginB = {
    NumberLiteral(node) {
      node.value = node.value + 5;
    },
  };
  transformer.runPlugins(ast, [pluginA, pluginB]);
  // return;

  const result = generator.generate(ast);
  console.log(result);
}

main();
