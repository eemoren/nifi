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

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {NiFiState} from '../index';
import {StatusHistoryService} from '../../service/status-history.service';
import * as StatusHistoryActions from './status-history.actions';
import {StatusHistoryRequest} from './index';
import {asyncScheduler, catchError, filter, from, interval, map, of, switchMap, takeUntil, tap} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {StatusHistory} from '../../ui/common/status-history/status-history.component';
import * as ErrorActions from '../../state/error/error.actions';
import {HttpErrorResponse} from '@angular/common/http';
import {ErrorHelper} from '../../service/error-helper.service';
import {ErrorContextKey} from '../error';
import {ComponentType} from '@nifi/shared';
import {concatLatestFrom} from "@ngrx/operators";
import {selectStatusHistory, selectStatusHistoryComponentDetails} from "./status-history.selectors";
import {loadStatusHistorySuccess, reloadStatusHistory} from "./status-history.actions";

@Injectable()
export class StatusHistoryEffects {

    constructor(
        private actions$: Actions,
        private store: Store<NiFiState>,
        private statusHistoryService: StatusHistoryService,
        private dialog: MatDialog,
        private errorHelper: ErrorHelper
    ) {}

    reloadComponentStatusHistory$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.reloadStatusHistory),
            map((action) => action.request),
            filter((request) => !!request.componentId && !!request.componentType),
            switchMap((request: StatusHistoryRequest) =>
                from(
                    this.statusHistoryService
                        .getComponentStatusHistory(request.componentType, request.componentId)
                        .pipe(
                            map((response: any) =>
                                StatusHistoryActions.reloadStatusHistorySuccess({
                                    response: {
                                        statusHistory: {
                                            canRead: response.canRead,
                                            statusHistory: response.statusHistory
                                        }
                                    }
                                })
                            ),
                            catchError((errorResponse: HttpErrorResponse) =>
                                this.bannerOrFullScreenError(errorResponse)
                            )
                        )
                )
            )
        )
    );

    reloadNodeStatusHistory$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.reloadStatusHistory),
            map((action) => action.request),
            filter((request) => !request.componentId && !request.componentType),
            switchMap(() =>
                from(
                    this.statusHistoryService.getNodeStatusHistory().pipe(
                        map((response: any) =>
                            StatusHistoryActions.reloadStatusHistorySuccess({
                                response: {
                                    statusHistory: {
                                        canRead: response.canRead,
                                        statusHistory: response.statusHistory
                                    }
                                }
                            })
                        ),
                        catchError((errorResponse: HttpErrorResponse) => this.bannerOrFullScreenError(errorResponse))
                    )
                )
            )
        )
    );


    setStatusHistoryAutoRefresh$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.setStatusHistoryAutoRefresh),
            /*map((action) => action.autoRefresh),*/
            switchMap((action) => {
                if (action.autoRefresh) {
                    console.log("autorefresh on")
                    return of(StatusHistoryActions.startStatusHistoryPolling());
                }
                console.log("autorefresh off")
                return of(StatusHistoryActions.stopStatusHistoryPolling());
            })

    ) );


    startStatusHistoryPolling$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.startStatusHistoryPolling),
            //map((action) => action.request),
            switchMap(({componentId, componentType}) =>
                interval(3000, asyncScheduler).pipe(
                    takeUntil(this.actions$.pipe(ofType(StatusHistoryActions.stopStatusHistoryPolling))),
            switchMap(() =>
            this.statusHistoryService.getStatusHistory(componentId, componentType).pipe(
                map((statusHistory) => reloadStatusHistory({ statusHistory,

                })),  // Success

            ),

            )

    );

    /*startStatusHistoryPolling$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.startStatusHistoryPolling),
            //map((action) => action.request),
            switchMap(() =>
                interval(3000, asyncScheduler).pipe(
                    takeUntil(this.actions$.pipe(ofType(StatusHistoryActions.stopStatusHistoryPolling)))
                )),
            concatLatestFrom(() => [
                //this.store.select(selectStatusHistoryComponentDetails),
                this.store.select(selectStatusHistory),
                this.store.select(selectStatusHistoryComponentDetails),
                //this.store.select(selectStatusHistoryState),


            ]),
            //map(([,action]) => action.statusHistory.componentDetails),
            switchMap(([,entity,type]) => {

                    /!*console.log("Type (e): " ,String (entity.statusHistory.componentDetails.Type))
                    console.log("ID: (e)" ,String(entity.statusHistory.componentDetails.Id))
                    console.log("Source (e): " ,String (entity.statusHistory.componentDetails.Name))*!/
                    /!*  const response: StatusHistoryResponse= {
                          statusHistory: entity
                      }*!/
                    /!*        this.store.dispatch(
                                StatusHistoryActions.viewStatusHistoryComplete({
                                    request: {
                                        source: entity.statusHistory.componentDetails.Name,
                                        componentType: entity.statusHistory.componentDetails.Type,
                                        componentId: entity.statusHistory.componentDetails.Id
                                    }
                                })
                            );*!/
                    const request: StatusHistoryRequest = {
                        componentId: entity.statusHistory.componentDetails.Id,
                        componentType: ComponentType.Processor,
                        source: ''
                    };
                    /!*const request2: StatusHistoryState = {

                        /!*componentId: entity.statusHistory.componentDetails.Id,
                        componentType: ComponentType.Flow,
                        source: ''*!/
                    };*!/


                    //console.log("Type before: " ,String (request.componentType))

                    //request.componentType =  <ComponentType>this.getComponentType(request.source)
                    console.log("Type: " ,String (request.componentType))
                    console.log("ID: " ,String(request.componentId))
                    console.log("Source: " ,String (request.source))

                    //request.componentType = type;
                    //action.statusHistory.componentDetails.Type
                    console.log("reload")

                    return of(StatusHistoryActions.reloadStatusHistory({request}
                    ))
                }
            )
        )
    );*/


    getStatusHistoryAndOpenDialog$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.getStatusHistoryAndOpenDialog),
            map((action) => action.request),
            switchMap((request) =>
                from(
                    this.statusHistoryService
                        .getComponentStatusHistory(request.componentType, request.componentId)
                        .pipe(
                            map((response: any) =>
                                StatusHistoryActions.loadStatusHistorySuccess({
                                    request,
                                    response: {
                                        statusHistory: {
                                            canRead: response.canRead,
                                            statusHistory: response.statusHistory
                                        }
                                    }
                                })
                            ),
                            catchError((errorResponse: HttpErrorResponse) =>
                                this.snackBarOrFullScreenError(errorResponse)
                            )
                        )
                )
            )
        )
    );

    getNodeStatusHistoryAndOpenDialog$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.getNodeStatusHistoryAndOpenDialog),
            map((action) => action.request),
            switchMap((request) =>
                from(
                    this.statusHistoryService.getNodeStatusHistory().pipe(
                        map((response: any) =>
                            StatusHistoryActions.loadStatusHistorySuccess({
                                request,
                                response: {
                                    statusHistory: {
                                        canRead: response.canRead,
                                        statusHistory: response.statusHistory
                                    }
                                }
                            })
                        ),
                        catchError((errorResponse: HttpErrorResponse) => this.snackBarOrFullScreenError(errorResponse))
                    )
                )
            )
        )
    );

    loadStatusHistorySuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.loadStatusHistorySuccess),
            map((action) => action.request),
            switchMap((request) => of(StatusHistoryActions.openStatusHistoryDialog({ request })))
        )
    );

    openStatusHistoryDialog$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(StatusHistoryActions.openStatusHistoryDialog),
                map((action) => action.request),
                tap((request) => {
                    const dialogReference = this.dialog.open(StatusHistory, {
                        maxHeight: 'unset',
                        maxWidth: 'unset',
                        data: request,
                        autoFocus: 'dialog'
                    });

                    dialogReference.afterClosed().subscribe((response) => {
                        if (response !== 'ROUTED') {
                            if ('componentType' in request) {
                                this.store.dispatch(
                                    StatusHistoryActions.viewStatusHistoryComplete({
                                        request: {
                                            source: request.source,
                                            componentType: request.componentType,
                                            componentId: request.componentId
                                        }
                                    })
                                );
                            } else {
                                this.store.dispatch(
                                    StatusHistoryActions.viewNodeStatusHistoryComplete({
                                        request: {
                                            source: request.source
                                        }
                                    })
                                );
                            }
                        }
                    });
                })
            ),
        { dispatch: false }
    );

    statusHistoryBannerError$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StatusHistoryActions.statusHistoryBannerError),
            map((action) => action.error),
            switchMap((error) =>
                of(
                    ErrorActions.addBannerError({
                        errorContext: { errors: [error], context: ErrorContextKey.STATUS_HISTORY }
                    })
                )
            )
        )
    );

    private getComponentType(sourceType: string): ComponentType {
        switch (sourceType) {
            case 'PROCESSOR':
                return ComponentType.Processor;
            case 'REMOTE_PROCESS_GROUP':
                return ComponentType.RemoteProcessGroup;
            case 'INPUT_PORT':
                return ComponentType.InputPort;
            case 'OUTPUT_PORT':
                return ComponentType.OutputPort;
            case 'FUNNEL':
                return ComponentType.Funnel;
            case 'CONTROLLER_SERVICE':
                return ComponentType.ControllerService;
            case 'REPORTING_TASK':
                return ComponentType.ReportingTask;
            case 'FLOW_ANALYSIS_RULE':
                return ComponentType.FlowAnalysisRule;
            case 'PARAMETER_PROVIDER':
                return ComponentType.ParameterProvider;
            case 'FLOW_REGISTRY_CLIENT':
                return ComponentType.FlowRegistryClient;
            default:
                return ComponentType.Processor;
        }
    }

    private bannerOrFullScreenError(errorResponse: HttpErrorResponse) {
        if (this.errorHelper.showErrorInContext(errorResponse.status)) {
            const error = this.errorHelper.getErrorString(errorResponse, 'Failed to reload Status History.');

            return of(StatusHistoryActions.statusHistoryBannerError({ error }));
        } else {
            return of(this.errorHelper.fullScreenError(errorResponse));
        }
    }

    private snackBarOrFullScreenError(errorResponse: HttpErrorResponse) {
        if (this.errorHelper.showErrorInContext(errorResponse.status)) {
            const error = this.errorHelper.getErrorString(errorResponse, 'Failed to load Status History.');
            return of(ErrorActions.snackBarError({ error }));
        } else {
            return of(this.errorHelper.fullScreenError(errorResponse));
        }
    }
}
