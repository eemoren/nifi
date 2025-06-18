/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import {StatusHistoryEntity, statusHistoryFeatureKey, StatusHistoryRequest, StatusHistoryState} from './index';
import {selectCurrentRoute} from "@nifi/shared";
import {SelectedComponent} from "../../pages/flow-designer/state/flow";

export const selectStatusHistoryState = createFeatureSelector<StatusHistoryState>(statusHistoryFeatureKey);

export const selectStatusHistoryRequest = createFeatureSelector<StatusHistoryRequest>(statusHistoryFeatureKey);


export const selectStatusHistory = createSelector(
    selectStatusHistoryState,
    (state: StatusHistoryState) => state.statusHistory
);

export const selectStatusHistoryComponentDetails = createSelector(
    selectStatusHistory,
    (state: StatusHistoryEntity) => state.statusHistory?.componentDetails
);

export const selectStatusHistoryFieldDescriptors = createSelector(
    selectStatusHistory,
    (state: StatusHistoryEntity) => state.statusHistory?.fieldDescriptors
);

export const selectStatusHistoryComponentType = createSelector(
    selectStatusHistoryRequest,
    (state: StatusHistoryRequest) => state.componentType
);
export const selectStatusHistoryComponentID = createSelector(
    selectStatusHistoryRequest,
    (state: StatusHistoryRequest) => state.componentId
);

/*export const selectStatusHistorySource = createSelector(
    selectStatusHistoryState,
    (state: StatusHistoryRequest) => state.statusHistoryItems
);*/
