import {
  StateGraph,
  MessagesAnnotation,
  START,
} from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import type { BaseMessage, AIMessage } from '@langchain/core/messages';
import type { ToolRegistry } from '../tools/tool.registry';
import type { ToolAuditEntry } from './audit.service';
import {
  createAgentNode,
  createConfirmNode,
  createToolsNode,
  routeAfterAgent,
} from './agent.nodes';

export interface AgentModelLike {
  bindTools(tools: unknown[]): {
    invoke(messages: BaseMessage[]): Promise<AIMessage>;
  };
}

export interface AgentAuditSink {
  record(entry: ToolAuditEntry): Promise<void>;
  findCompleted?(threadId: string, toolCallId: string): Promise<string | null>;
}

export interface AgentGraphDeps {
  model: AgentModelLike;
  registry: ToolRegistry;
  checkpointer: BaseCheckpointSaver;
  audit: AgentAuditSink;
  limits: {
    maxToolCallsPerTurn: number;
    historyMaxMessages: number;
  };
}

export function buildAgentGraph(deps: AgentGraphDeps) {
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', createAgentNode(deps))
    .addNode('confirm', createConfirmNode(deps))
    .addNode('tools', createToolsNode(deps))
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', routeAfterAgent)
    .addEdge('confirm', 'tools')
    .addEdge('tools', 'agent');

  return workflow.compile({ checkpointer: deps.checkpointer });
}
