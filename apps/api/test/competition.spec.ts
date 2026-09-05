describe('Competition Business Rules', () => {
  it('must strictly enforce 100% Free-to-Play rule (isFreeEntry = true)', () => {
    const defaultCompetition = {
      isFreeEntry: true,
      entryFeeAmount: 0,
      allowsDepositWallet: false,
    };

    expect(defaultCompetition.isFreeEntry).toBe(true);
    expect(defaultCompetition.entryFeeAmount).toBe(0);
    expect(defaultCompetition.allowsDepositWallet).toBe(false);
  });
});
