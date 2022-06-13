////////////////////////////////////////////////////////////////////////////
//
// Copyright 2022 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

import { Command, InvalidArgumentError } from "commander";
import fs from "fs";
import path from "path";

import { debug, enableDebugging } from "./debug";
import { generate } from "./generator";
import { parseSpec } from "./spec";
import { Template, TEMPLATES } from "./templates";

type ProgramOptions = {
  spec: string;
  template: Template;
  output: string;
  debug: boolean;
};

export const program = new Command();

program.name("realm-bindgen");

function parsePath(input: string) {
  return path.resolve(input);
}

function parseExistingFilePath(input: string) {
  const parsed = parsePath(input);
  if (!fs.existsSync(parsed) || !fs.statSync(parsed).isFile()) {
    throw new InvalidArgumentError(`Expected '${parsed}' file to exist.`);
  }
  return parsed;
}

const specOption = program
  .createOption("-s, --spec <output>", "Path of the API specification")
  .argParser(parseExistingFilePath)
  .makeOptionMandatory();

const templateOption = program
  .createOption("-t, --template <template>", "Template to apply when generating")
  .choices(Object.keys(TEMPLATES))
  .argParser((name) => {
    if (name in TEMPLATES) {
      return TEMPLATES[name];
    } else {
      throw new InvalidArgumentError(`Unsupported template (${name})`);
    }
  })
  .makeOptionMandatory();

const outputOption = program
  .createOption("-o, --output <output>", "Path of a directory to write the binding")
  .argParser(parsePath)
  .makeOptionMandatory();

const debugOption = program.createOption("-d, --debug", "Turn on debug printing").default(false);

program
  .command("generate", { isDefault: true })
  .addOption(specOption)
  .addOption(templateOption)
  .addOption(outputOption)
  .addOption(debugOption)
  .action((args) => {
    const { spec: specPath, template, output: outputPath, debug: isDebugging } = args as ProgramOptions;
    if (isDebugging) {
      enableDebugging();
      debug("Debugging enabled");
    }
    const spec = parseSpec(specPath);
    generate({ spec, template, outputPath });
  });

program.command("validate").addOption(specOption).addOption(debugOption);
