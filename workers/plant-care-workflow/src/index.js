import { WorkflowEntrypoint } from "cloudflare:workers";

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const secureEquals = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
};

export class PlantCareWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const result = await step.do(
      "run-botanical-inspection",
      {
        timeout: "10 minutes",
        retries: { limit: 1, delay: "10 seconds", backoff: "exponential" },
      },
      async () => {
        const response = await fetch("https://florial-bg.com/api/manager/enrich-plant-care/process", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-florial-workflow-token": this.env.PLANT_CARE_WORKFLOW_SECRET,
          },
          body: JSON.stringify(event.payload),
        });
        const responseText = await response.text();
        let body;
        try { body = JSON.parse(responseText); }
        catch { body = { unparsedResponse: responseText.slice(0, 5000) }; }
        if (!response.ok) {
          throw new Error(JSON.stringify({
            httpStatus: response.status,
            response: body,
          }).slice(0, 6000));
        }
        return body;
      },
    );
    return result;
  }
}

export default {
  async fetch(request, env) {
    const expected = env.PLANT_CARE_WORKFLOW_SECRET || "";
    const authorization = request.headers.get("authorization") || "";
    if (!expected || !secureEquals(authorization, "Bearer " + expected)) {
      return json({ error: "Unauthorized." }, 401);
    }

    const url = new URL(request.url);
    if (url.pathname === "/start" && request.method === "POST") {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: "Invalid JSON body." }, 400); }

      const submissionId = body?.submissionId;
      const callerId = body?.callerId;
      const workflowId = body?.workflowId;
      const reviewInput = body?.reviewInput;
      if (!isUuid(submissionId) || !isUuid(callerId) ||
          typeof workflowId !== "string" ||
          !workflowId.startsWith(submissionId + "-") ||
          workflowId.length > 100 ||
          !reviewInput || typeof reviewInput !== "object") {
        return json({ error: "Invalid workflow parameters." }, 400);
      }

      try {
        const instance = await env.PLANT_CARE_WORKFLOW.create({
          id: workflowId,
          params: { submissionId, callerId, reviewInput },
        });
        return json({ workflowId: instance.id, status: (await instance.status()).status }, 202);
      } catch (error) {
        return json({
          error: "Не удалось поставить ботаническую проверку в очередь.",
          detail: error instanceof Error ? error.message : String(error),
        }, 503);
      }
    }

    if (url.pathname === "/status" && request.method === "GET") {
      const workflowId = url.searchParams.get("id") || "";
      if (workflowId.length < 40 || workflowId.length > 100) return json({ error: "Invalid workflow ID." }, 400);
      try {
        const instance = await env.PLANT_CARE_WORKFLOW.get(workflowId);
        return json({ workflowId, status: await instance.status() });
      } catch (error) {
        return json({
          error: "Не удалось получить состояние ботанической проверки.",
          detail: error instanceof Error ? error.message : String(error),
        }, 404);
      }
    }

    return json({ error: "Not found." }, 404);
  },
};
