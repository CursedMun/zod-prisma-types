import { writeNonScalarType, writeScalarType, writeSpecialType } from '..';
import { ExtendedDMMFSchemaField } from '../../classes';
import { type ContentWriterOptions } from '../../types';
import { writeSelect } from './writeSelect';

export const writeOutputObjectType = (
  { fileWriter, dmmf, getSingleFileContent = false }: ContentWriterOptions,
  field: ExtendedDMMFSchemaField,
) => {
  const { writer, writeImportSet, writeHeading } = fileWriter;

  const { useMultipleFiles, findFirst } = dmmf.generatorConfig;

  if (useMultipleFiles && !getSingleFileContent) {
    writeImportSet(field.argTypeImports);

    // determine if the outputType should include the "select" or "include" field
    const modelWithSelect = dmmf.schema.getModelWithIncludeAndSelect(field);

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // ONLY FOR MULTI FILE IMPORTS!
    // The select schema needs to be in the same file as
    // the model's args schema to prevent circular imports.
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    if (modelWithSelect && field.generatorConfig.addSelectType) {
      // if the outputType has a "select" or "include" field,
      // the schemas that are used in the type of the field
      //  needs to be imported

      // temporary workaround to prevent importing the generated schema when
      // there is a self reference in the model
      const filterdImports = [
        ...modelWithSelect.includeImports,
        ...modelWithSelect.selectImports,
      ].filter((imp) => !!field.argName && !imp.includes(field.argName));

      writeImportSet(new Set(filterdImports));

      // Only write the select type if the outputType has a "select" or "include" field.
      // Some outputTypes like "CreateMany", "UpdateMany", "DeleteMany"
      // do not have a "select" or "include" field.

      if (field.writeSelectAndIncludeArgs) {
        writeHeading(
          'Select schema needs to be in file to prevent circular imports',
        );

        writeSelect(
          { fileWriter, dmmf, getSingleFileContent: true },
          modelWithSelect,
        );
      }
    }
  }
  if (!field.argName || !field.argName.toLowerCase().includes('findmany')) {
    return;
  }
  if (field.name.match(/updatetoone/gi)) {
    return;
  }
  // findManyChat;
  const fieldName = field.name.replace('findMany', '');

  // ChatFindManyArgs;
  const baseType = `Pick<Prisma.${fieldName}FindManyArgs, ${
    field.writeIncludeArg ? `'include' |` : ''
  } 'where' | 'orderBy' | 'take' | 'skip'>`;

  writer.blankLine().write(`export type T${field.argName} = ${baseType}`);
  const type = `z.ZodType<T${field.argName}>`;

  writer
    .blankLine()
    .write(`export const ${field.argName}Schema: ${type}`)
    // .write(field.customArgType)
    .write(` = `)
    .write(`z.object(`)
    .inlineBlock(() => {
      writer
        // .conditionalWriteLine(
        //   field.writeSelectArg,
        //   `select: ${field.modelType}SelectSchema.optional(),`,
        // )
        .conditionalWriteLine(
          field.writeIncludeArg,
          `include: ${field.modelType}IncludeSchema.optional(),`,
        );
      field.args.forEach((arg) => {
        if (arg.name === 'cursor' || arg.name === 'distinct') {
          return;
        }
        writer.write(`${arg.name}: `);

        const { isOptional, isNullable } = arg;

        if (arg.hasMultipleTypes) {
          writer.write(`z.union([ `);

          arg.inputTypes.forEach((inputType, idx) => {
            const writeComma = idx !== arg.inputTypes.length - 1;

            writeScalarType(writer, {
              inputType,
              writeLazy: false,
              writeComma,
            });
            writeNonScalarType(writer, {
              inputType,
              writeLazy: false,
              writeComma,
            });
            writeSpecialType(writer, {
              inputType,
              writeLazy: false,
              writeComma,
            });
          });

          writer
            .write(` ])`)
            .conditionalWrite(arg.isOptional, `.optional()`)
            .conditionalWrite(arg.isNullable, `.nullable()`)
            .write(`,`);
        } else {
          writeScalarType(writer, {
            inputType: arg.inputTypes[0],
            writeLazy: false,
            isNullable,
            isOptional,
          });
          writeNonScalarType(writer, {
            inputType: arg.inputTypes[0],
            writeLazy: false,
            isNullable,
            isOptional,
          });
          writeSpecialType(writer, {
            inputType: arg.inputTypes[0],
            writeLazy: false,
            isNullable,
            isOptional,
          });
        }

        writer.newLine();
      });
    })
    .write(`).strict()`);

  if (findFirst) {
    writer.blankLine().writeLine(`export type T${fieldName}FindFirstArgs = Omit<
    T${field.argName}, 'take' | 'skip'>`);
    const type = `z.ZodType<Partial<T${fieldName}FindFirstArgs>>`;

    writer
      .blankLine()
      .writeLine(`export const ${fieldName}FindFirstSchema: ${type}`)
      .write(` = `)
      .write(
        `(${field.argName}Schema as any).omit({ take: true, skip: true })`,
      );
  }
  if (useMultipleFiles && !getSingleFileContent) {
    writer.blankLine().writeLine(`export default ${field.argName}Schema;`);
  }
};
