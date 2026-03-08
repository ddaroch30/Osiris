describe('Jira mapper contract', () => {
  it('maps jira issue payload into canonical requirement shape', () => {
    const issue = { id: '1', key: 'PAY-1', fields: { summary: 'story', priority: { name: 'High' } } };
    const mapped = { externalId: issue.id, key: issue.key, title: issue.fields.summary, priority: issue.fields.priority.name };
    expect(mapped).toEqual({ externalId: '1', key: 'PAY-1', title: 'story', priority: 'High' });
  });
});
