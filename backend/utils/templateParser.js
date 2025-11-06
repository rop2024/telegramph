class TemplateParser {
  static parseTemplate(template, variables = {}) {
    let parsedTemplate = template;

    // Replace {{variable}} with actual values
    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      parsedTemplate = parsedTemplate.replace(placeholder, variables[key] || '');
    });

    // Remove any remaining placeholders
    parsedTemplate = parsedTemplate.replace(/{{[^{}]*}}/g, '');

    return parsedTemplate;
  }

  static extractVariables(template) {
    const variableRegex = /{{([^{}]+)}}/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)]; // Remove duplicates
  }

  static generatePersonalizedContent(draft, receiver, user) {
    const baseVariables = {
      recipientName: receiver.name,
      recipientEmail: receiver.email,
      company: receiver.company || 'Our Company',
      department: receiver.department || '',
      senderName: user.username,
      senderEmail: user.email,
      currentDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      currentYear: new Date().getFullYear()
    };

    // Parse subject
    const parsedSubject = this.parseTemplate(draft.subject, baseVariables);

    // Parse body
    const parsedBody = this.parseTemplate(draft.body, baseVariables);

    return {
      subject: parsedSubject,
      body: parsedBody,
      variablesUsed: Object.keys(baseVariables)
    };
  }
}

module.exports = TemplateParser;