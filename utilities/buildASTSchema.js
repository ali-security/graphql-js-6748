"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildASTSchema = buildASTSchema;
exports.buildSchema = buildSchema;

var _devAssert = _interopRequireDefault(require("../jsutils/devAssert"));

var _kinds = require("../language/kinds");

var _parser = require("../language/parser");

var _validate = require("../validation/validate");

var _schema = require("../type/schema");

var _directives = require("../type/directives");

var _extendSchema = require("./extendSchema");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * This takes the ast of a schema document produced by the parse function in
 * src/language/parser.js.
 *
 * If no schema definition is provided, then it will look for types named Query
 * and Mutation.
 *
 * Given that AST it constructs a GraphQLSchema. The resulting schema
 * has no resolve methods, so execution will use default resolvers.
 *
 * Accepts options as a second argument:
 *
 *    - commentDescriptions:
 *        Provide true to use preceding comments as the description.
 *
 */
function buildASTSchema(documentAST, options) {
  documentAST && documentAST.kind === _kinds.Kind.DOCUMENT || (0, _devAssert.default)(0, 'Must provide valid Document AST.');

  if (!options || !(options.assumeValid || options.assumeValidSDL)) {
    (0, _validate.assertValidSDL)(documentAST);
  }

  var config = (0, _extendSchema.extendSchemaImpl)(emptySchemaConfig, documentAST, _objectSpread({}, options, {
    assumeValidSDL: true
  }));

  if (config.astNode == null) {
    for (var _i2 = 0, _config$types2 = config.types; _i2 < _config$types2.length; _i2++) {
      var type = _config$types2[_i2];

      switch (type.name) {
        // Note: While this could make early assertions to get the correctly
        // typed values below, that would throw immediately while type system
        // validation with validateSchema() will produce more actionable results.
        case 'Query':
          config.query = type;
          break;

        case 'Mutation':
          config.mutation = type;
          break;

        case 'Subscription':
          config.subscription = type;
          break;
      }
    }
  }

  var directives = config.directives; // If specified directives were not explicitly declared, add them.

  if (!directives.some(function (directive) {
    return directive.name === 'skip';
  })) {
    directives.push(_directives.GraphQLSkipDirective);
  }

  if (!directives.some(function (directive) {
    return directive.name === 'include';
  })) {
    directives.push(_directives.GraphQLIncludeDirective);
  }

  if (!directives.some(function (directive) {
    return directive.name === 'deprecated';
  })) {
    directives.push(_directives.GraphQLDeprecatedDirective);
  }

  return new _schema.GraphQLSchema(config);
}

var emptySchemaConfig = new _schema.GraphQLSchema({
  directives: []
}).toConfig();
/**
 * A helper function to build a GraphQLSchema directly from a source
 * document.
 */

function buildSchema(source, options) {
  var document = (0, _parser.parse)(source, {
    noLocation: options && options.noLocation || false,
    allowLegacySDLEmptyFields: options && options.allowLegacySDLEmptyFields || false,
    allowLegacySDLImplementsInterfaces: options && options.allowLegacySDLImplementsInterfaces || false,
    experimentalFragmentVariables: options && options.experimentalFragmentVariables || false
  });
  return buildASTSchema(document, {
    commentDescriptions: options && options.commentDescriptions || false,
    assumeValidSDL: options && options.assumeValidSDL || false,
    assumeValid: options && options.assumeValid || false
  });
}