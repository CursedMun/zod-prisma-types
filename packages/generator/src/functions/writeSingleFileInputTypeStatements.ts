import { type WriteStatements } from '../types';
import { writeInputObjectType } from './contentWriters';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////
const allowedMethods = [
  'where',
  'orderbywithrelation',
  'filter',
  'aggregateinput',
  'orderinput',
];

const notAllowedMethods = [
  'whereunique',
  'updatemany',
  'updateone',
  'updatetoone',
  'byaggregate',
];
export const writeSingleFileInputTypeStatements: WriteStatements = (
  dmmf,
  fileWriter,
) => {
  if (!dmmf.generatorConfig.createInputTypes) return;

  fileWriter.writer.blankLine();

  fileWriter.writeHeading(`INPUT TYPES`, 'FAT');
  const inputTypes = [] as string[];
  dmmf.schema.inputObjectTypes.prisma.forEach((inputType) => {
    inputTypes.push(inputType.name);
    if (!allowedMethods.some((x) => inputType.name.toLowerCase().includes(x))) {
      return;
    }
    if (
      notAllowedMethods.some((x) => inputType.name.toLowerCase().includes(x))
    ) {
      return;
    }
    writeInputObjectType({ dmmf, fileWriter }, inputType);
    fileWriter.writer.newLine();
  });
};
