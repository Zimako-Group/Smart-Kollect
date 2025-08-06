declare module 'papaparse' {
  export interface ParseConfig {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    download?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    fastMode?: boolean;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    delimitersToGuess?: string[];
    complete?: (results: ParseResult<any>, file?: File) => void;
    error?: (error: Error, file?: File) => void;
    chunk?: (results: ParseResult<any>, parser: Parser) => void;
    beforeFirstChunk?: (chunk: string) => string | void;
    step?: (results: ParseStepResult<any>, parser: Parser) => void;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      fields?: string[];
    };
  }

  export interface ParseStepResult<T> {
    data: T[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      fields?: string[];
    };
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
    index: number;
  }

  export interface UnparseConfig {
    quotes?: boolean | boolean[] | ((value: any) => boolean);
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | 'greedy';
    columns?: string[] | ((fields: string[]) => string[]);
  }

  export interface UnparseObject {
    fields: Array<any>;
    data: string | Array<any>;
  }

  export interface Parser {
    abort: () => void;
    pause: () => void;
    resume: () => void;
  }

  export default {
    parse: <T>(input: string | File | NodeJS.ReadableStream, config?: ParseConfig) => ParseResult<T>,
    unparse: (data: Array<Object> | Array<Array<any>> | UnparseObject, config?: UnparseConfig) => string,
    RECORD_SEP: string,
    UNIT_SEP: string,
    BYTE_ORDER_MARK: string,
    BAD_DELIMITERS: Array<string>,
    WORKERS_SUPPORTED: boolean
  };
}
