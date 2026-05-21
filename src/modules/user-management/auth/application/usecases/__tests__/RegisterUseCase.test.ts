import { RegisterUseCase } from '../RegisterUseCase';

describe('RegisterUseCase', () => {
  it('lanca erro explicito enquanto a implementacao nao existe', async () => {
    const useCase = new RegisterUseCase();

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'secret',
        displayName: 'User',
      })
    ).rejects.toThrow('RegisterUseCase.execute must be implemented');
  });
});
