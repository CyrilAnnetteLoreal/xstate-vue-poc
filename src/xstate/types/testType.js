const Ajv = require("ajv")
const ajv = new Ajv()

/* Array of strings */
const schema = {
  type: "array",
  items: {
    type: "string",
  },
};

export default ajv.compile(schema);
