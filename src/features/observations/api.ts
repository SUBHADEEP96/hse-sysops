import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";
import type { DynamicForm, SubmissionPayload } from "./model";
export const getDynamicForm = (id: string) => request<DynamicForm>("sat", `${routes.dynamicForm}/${encodeURIComponent(id)}`);
export const submitObservation = (payload: SubmissionPayload) => request("sat", routes.submissions, { method: "POST", body: payload });
export const getLikelihood = () => request<{ likelihood_of_harm: string; value: number }[]>("sat", routes.likelihood);
export const getSeverity = () => request<{ severity_of_harm: string; value: number }[]>("sat", routes.severity);
