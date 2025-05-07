import { Mistral } from '@mistralai/mistralai';

const token = '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';
const endpoint = "https://models.github.ai/inference";

const MODELS = {
  primary: {
    name: "mistral-ai/Mistral-Large-2411",
    client: new Mistral({ apiKey: token, serverURL: endpoint })
  }
};

const generateWithModel = async (model, messages, temperature = 0.7, top_p = 1.0) => {
  try {
    const response = await model.client.chat.complete({
      model: model.name,
      messages: messages,
      temperature: temperature,
      top_p: top_p
    });
    return response.choices[0].message.content;
  } catch (error) {
    if (error.message?.includes('token limit') || error.message?.includes('context length')) {
      throw new Error('TOKEN_LIMIT');
    }
    throw error;
  }
};

export const generateAISuggestion = async ({
  tasks = [],
  todos = [],
  context = 'task',
  customPrompt = null
}) => {
  try {
    const taskContext = tasks.map(t => ({
      text: t.text,
      status: t.status,
      priority: t.priority
    }));

    const todoContext = todos.map(t => ({
      text: t.text,
      created_at: t.created_at
    }));

    const prompts = {
      task: `You are a helpful task management assistant that helps teachers organize their teaching tasks.
      Analyze both the user's current tasks and their teaching goals (todos) to suggest complementary tasks.
      
      When suggesting tasks:
      1. Wrap the main task in ** markers to indicate it should be bold
      2. Include a suggested priority level (High, Medium, Low)
      3. Consider the teaching goals from the todos as your primary focus
      4. Suggest tasks that will help achieve these teaching goals
      5. Include estimated time to complete
      6. Explain how this task supports the teaching goals
      
      Format your response like this:
      **Task Title** (Priority Level, Est. Time: X minutes)
      
      This task supports your teaching goals by:
      - [How it relates to teaching goal 1]
      - [How it relates to teaching goal 2]
      - [Additional benefits]
      
      Suggested priority because:
      - [Reason 1]
      - [Reason 2]`,

      todo: `You are a helpful teaching assistant that helps create learning objectives.
      Analyze the current teaching goals and suggest new ones that would enhance the learning experience.
      
      When suggesting teaching goals:
      1. Wrap the main goal in ** markers to indicate it should be bold
      2. Consider the existing teaching goals and tasks
      3. Suggest goals that build upon or complement existing ones
      4. Include why this goal is important
      
      Format your response like this:
      **Teaching Goal** (Category)
      
      This goal is important because:
      - [Reason 1]
      - [Reason 2]
      
      Related to existing goals:
      - [Connection 1]
      - [Connection 2]`
    };

    const messages = [
      { 
        role: "system", 
        content: customPrompt || prompts[context]
      },
      { 
        role: "user", 
        content: `Current Tasks: ${JSON.stringify(taskContext)}
        Teaching Goals (from TodoTeach): ${JSON.stringify(todoContext)}
        
        Please analyze my teaching goals and current tasks to suggest a new ${context === 'task' ? 'task' : 'teaching goal'} that will help me achieve my teaching objectives.`
      }
    ];

    const model = MODELS.primary;
    const suggestion = await generateWithModel(model, messages);
    return {
      success: true,
      suggestion: suggestion.trim(),
      model: 'primary'
    };

  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return {
      success: false,
      error: 'Sorry, I encountered an error while generating a suggestion. Please try again.'
    };
  }
};

export const renderFormattedText = (text) => {

  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {

    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2); 
      return <strong key={index}>{boldText}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};
