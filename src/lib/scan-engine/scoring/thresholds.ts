// Score interpretation thresholds for user-facing messaging

export function getScoreInterpretation(score: number): {
  headline: string;
  description: string;
  urgency: 'critical' | 'warning' | 'ok' | 'good' | 'excellent';
} {
  if (score >= 90) {
    return {
      headline: 'Your business is highly visible to AI',
      description:
        'Great job! Your website is well-optimized for AI discovery. Keep maintaining your content and structured data to stay ahead.',
      urgency: 'excellent',
    };
  }
  if (score >= 70) {
    return {
      headline: 'Your business is mostly visible to AI',
      description:
        'You\'re in good shape, but there are a few improvements that could make a real difference. Focus on the top recommendations below.',
      urgency: 'good',
    };
  }
  if (score >= 50) {
    return {
      headline: 'AI might find you, but not reliably',
      description:
        'Your website has some good elements, but AI systems may struggle to confidently recommend you. The fixes below can significantly improve your visibility.',
      urgency: 'ok',
    };
  }
  if (score >= 30) {
    return {
      headline: 'Your business is mostly invisible to AI',
      description:
        'Right now, AI search engines are unlikely to recommend your business. The good news: the fixes are straightforward and can make a big impact.',
      urgency: 'warning',
    };
  }
  return {
    headline: 'AI can\'t find your business',
    description:
      'Your website is currently invisible to AI search engines like ChatGPT and Google AI. This means when people ask AI about your industry, your competitors are getting recommended instead. Let\'s fix that.',
    urgency: 'critical',
  };
}
