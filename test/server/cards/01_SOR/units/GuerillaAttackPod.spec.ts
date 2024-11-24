describe('Guerilla Attack Pod', function () {
    integration(function (contextRef) {
        describe('Guerilla Attack Pod\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['guerilla-attack-pod'],
                        groundArena: ['battlefield-marine'],
                        base: { card: 'energy-conversion-lab', damage: 14 }
                    },
                    player2: {
                        groundArena: ['rugged-survivors'],
                        base: { card: 'echo-base', damage: 14 }
                    }
                });
            });

            it('should not ready it if no base has more than 15 damage', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.guerillaAttackPod);
                expect(context.guerillaAttackPod.exhausted).toBeTrue();
            });

            it('should ready it if the controller\'s opponent\'s base has more than 15 damage', function () {
                const { context } = contextRef;

                // attack with battlefield marine to trigger guerilla attack pod
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.p2Base);
                expect(context.p2Base.damage).toBe(17);
                context.player2.passAction();
                context.player1.clickCard(context.guerillaAttackPod);
                expect(context.guerillaAttackPod.exhausted).toBeFalse();
            });

            it('should ready it if the controller\'s base has more than 15 damage', function () {
                const { context } = contextRef;

                // attack with rugged survivors to trigger guerilla attack pod
                context.player1.passAction();
                context.player2.clickCard(context.ruggedSurvivors);
                context.player2.clickCard(context.p1Base);
                expect(context.p1Base.damage).toBe(17);
                context.player1.clickCard(context.guerillaAttackPod);
                expect(context.guerillaAttackPod.exhausted).toBeFalse();
            });

            it('when combined with Energy Conversion Lab should allow the controller to ambush then ready it', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.p2Base);

                context.player2.passAction();

                context.player1.clickCard(context.energyConversionLab);
                expect(context.player1).toHavePassSingleTargetPrompt('Play a unit that costs 6 or less from your hand. Give it ambush for this phase', context.guerillaAttackPod);

                context.player1.clickPrompt('Play a unit that costs 6 or less from your hand. Give it ambush for this phase -> Guerilla Attack Pod');
                context.player1.clickPrompt('Ambush');
                expect(context.player1).toHavePassAbilityPrompt('Ambush');
                context.player1.clickPrompt('Ambush');
                expect(context.guerillaAttackPod.damage).toBe(3);
                expect(context.ruggedSurvivors.damage).toBe(4);
                expect(context.guerillaAttackPod.exhausted).toBe(false);
            });
        });
    });
});
