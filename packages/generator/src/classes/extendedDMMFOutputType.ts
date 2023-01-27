import { DMMF } from '@prisma/generator-helper';

import { ExtendedDMMFModel } from '.';
import { ExtendedDMMFDatamodel } from './extendedDMMFDatamodel';
import { ExtendedDMMFSchemaField } from './extendedDMMFSchemaField';
import { FormattedNames } from './formattedNames';
import { PRISMA_ACTION_ARRAY } from '../constants/objectMaps';
import { GeneratorConfig } from '../schemas';

/////////////////////////////////////////////////
// CLASS
/////////////////////////////////////////////////

export class ExtendedDMMFOutputType
  extends FormattedNames
  implements DMMF.OutputType
{
  readonly name: DMMF.OutputType['name'];
  readonly fields: ExtendedDMMFSchemaField[];
  readonly fieldMap?: DMMF.OutputType['fieldMap'];
  readonly prismaActionFields: ExtendedDMMFSchemaField[];
  readonly prismaOtherFields: ExtendedDMMFSchemaField[];
  readonly linkedModel?: ExtendedDMMFModel;

  constructor(
    readonly generatorConfig: GeneratorConfig,
    type: DMMF.OutputType,
    datamodel: ExtendedDMMFDatamodel,
  ) {
    super(type.name);
    this.generatorConfig = generatorConfig;
    this.name = type.name;
    this.fieldMap = type.fieldMap;
    this.fields = this._setFields(type.fields, datamodel);
    this.prismaActionFields = this._setFields(
      type.fields,
      datamodel,
      'PRISMA_ACTION',
    );
    this.prismaOtherFields = this._setFields(
      type.fields,
      datamodel,
      'OTHER_FIELDS',
    );
    this.linkedModel = this._setLinkedModel(datamodel);
  }

  /**
   * Finds the datamodel that matches the input type.
   * This way the documentation ,validator strings and other information
   * from the datamodel can be added to the input types.
   */
  private _setLinkedModel(datamodel: ExtendedDMMFDatamodel) {
    return datamodel.models.find((model) => {
      return this.name.match(model.name);
    });
  }

  /**
   * Creates an array of ExtendedDMMFSchemaField objects.
   * - Returns the fields that are in the `PRISMA_ACTION_ARRAY` if the fieldCategory is set to `PRISMA_ACTION`.
   * - Returns all fields that are not in `PRISMA_ACTION_ARRAY` if the fieldCategory is set to `OTHER_FIELDS`.
   */
  private _setFields(
    fields: DMMF.SchemaField[],
    datamodel: ExtendedDMMFDatamodel,
    fieldCategory?: 'PRISMA_ACTION' | 'OTHER_FIELDS',
  ) {
    if (fieldCategory === 'PRISMA_ACTION') {
      return fields
        .filter((field) =>
          PRISMA_ACTION_ARRAY.find((elem) => field.name.includes(elem)),
        )
        .map(
          (field) =>
            new ExtendedDMMFSchemaField(this.generatorConfig, field, datamodel),
        );
    }

    if (fieldCategory === 'OTHER_FIELDS') {
      return fields
        .filter(
          (field) =>
            !PRISMA_ACTION_ARRAY.find((elem) => field.name.includes(elem)),
        )
        .map(
          (field) =>
            new ExtendedDMMFSchemaField(this.generatorConfig, field, datamodel),
        );
    }

    return fields.map((field) => {
      return new ExtendedDMMFSchemaField(
        this.generatorConfig,
        field,
        datamodel,
      );
    });
  }

  /**
   * This function checks if the output type has a field with the name "_count".
   * This information is necessary when generating the `include` and `select` arguments.
   * @returns true if the output type has a field with the name "_count"
   */
  hasCountField() {
    return this.fields.some((field) => field.name === '_count');
  }

  /**
   * This function checks if the output type has fields that are relations to other models.
   * This information is necessary when generating the `include` and `select` arguments.
   * @returns true if the output type has fields that are relations to other models
   */
  hasRelationField() {
    return this.fields.some(
      (field) => field.outputType.location === 'outputObjectTypes',
    );
  }
}
