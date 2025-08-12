describe('Simple Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    expect('hello').toBe('hello');
    expect('hello'.length).toBe(5);
  });
});