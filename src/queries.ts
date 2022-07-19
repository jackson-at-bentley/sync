/*--------------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *------------------------------------------------------------------------------------------------*/

import * as backend from '@itwin/core-backend';
import * as bentley from '@itwin/core-bentley';
import * as common from '@itwin/core-common';

/**
 * Return the iModel ID of the model of an element if it is modeled.
 * @param imodel
 * @param modeled An element that may be modeled.
 * @returns The iModel ID of the model.
 */
export function modelOf(imodel: backend.IModelDb, modeled: bentley.Id64String): bentley.Id64String | null
{
    const query = 'select ECInstanceId from bis:Model where ModeledElement.id=?';

    return imodel.withPreparedStatement(query, (statement) => {
        statement.bindId(1, modeled);
        statement.step();

        // TODO: what does this do if it fails? When the resulting table is empty, for example.
        const modelId = statement.getValue(0);

        if (modelId.isNull) {
            return null;
        }

        return modelId.getId();
    });
}

/**
 * Return the iModel IDs of the immediate children of a model.
 * @param imodel
 * @param model The model containing the desired children.
 * @returns A list of iModel IDs of the immediate children.
 */
export function childrenOfModel(imodel: backend.IModelDb, model: bentley.Id64String): bentley.Id64String[]
{
  const elements: bentley.Id64String[] = [];
  const query = 'select ECInstanceId from bis:Element where Model.id=? and Parent is NULL';

  imodel.withPreparedStatement<void>(query, (statement) => {
        statement.bindId(1, model);
        for (const row of statement) {
            elements.push(row.id);
        }
    });

  return elements;
}

/**
 * Return the iModel IDs of the immediate children of an element.
 * @param imodel
 * @param element The element that owns the desired children.
 * @returns A list of iModel IDs of the immediate children.
 */
export function childrenOfElement(imodel: backend.IModelDb, element: bentley.Id64String): bentley.Id64String[]
{
    const elements: bentley.Id64String[] = [];
    const query = "select ECInstanceId from bis:Element as e where e.Parent.id=?";

    imodel.withPreparedStatement<void>(query, (statement) => {
        statement.bindId(1, element);
        for (const row of statement) {
            elements.push(row.id);
        }
    });

    return elements;
}

/**
 * Used in testing, and should be moved. Return the branches of an iModel with the given BIS class.
 * Does not return branches that have a class that descends from the given class. This function
 * narrows `any` and should be used with caution.
 * @param imodel
 * @param kind The full BIS class of the desired elements.
 * @returns The desired elements.
 */
export function findElements<E extends common.EntityProps>(imodel: backend.IModelDb, kind: string): E[]
{
    const query = `select * from only ${kind}`;

    return imodel.withPreparedStatement(query, (statement) => {
        const entities: E[] = [];

        for (const element of statement) {
            entities.push(element);
        }

        return entities;
    });
}
