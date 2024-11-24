describe('Finn, This is a Rescue', function () {
    integration(function (contextRef) {
        describe('Finn\'s undeployed ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['entrenched'],
                        leader: { card: 'finn#this-is-a-rescue', deployed: false },
                        groundArena: [{ card: 'battlefield-marine', upgrades: ['jedi-lightsaber'] }],
                        resources: 4
                    },
                    player2: {
                        hand: ['top-target'],
                        groundArena: ['wampa'],
                        resources: 5
                    }
                });
            });

            it('should defeat a friendly upgrade and give a shield token', function () {
                const { context } = contextRef;

                // For all scenarios, ensure an opponent's upgrade is attached. We should
                // never be able to choose this upgrade for Finn's ability.
                context.player1.passAction();
                context.player2.clickCard(context.topTarget);
                context.player2.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['jedi-lightsaber', 'top-target']);

                // Scenario 1: Defeat a friendly upgrade on a friendly unit
                context.player1.clickCard(context.finn);
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['shield', 'top-target']);
                expect(context.jediLightsaber).toBeInZone('discard');
                context.player2.passAction();
                // Finn should be exhausted
                expect(context.finn).not.toHaveAvailableActionWhenClickedBy(context.player1);

                // A bit of a hack to get the shield token. Since multiple shield tokens are
                // created, we want to ensure we get the correct one in the scenario below.
                context.shield = context.battlefieldMarine.upgrades.filter((u) => u.name === 'Shield')[0];

                // Reset
                context.finn.exhausted = false;

                // Scenario 2: Defeat a friendly upgrade on an opponent's unit
                context.player1.clickCard(context.entrenched);
                context.player1.clickCard(context.wampa);
                expect(context.wampa).toHaveExactUpgradeNames(['entrenched']);
                context.player2.passAction();
                context.player1.clickCard(context.finn);
                // There are now two friendly upgrades (entrenched and shield token), so we are prompted to select one
                expect(context.player1).toBeAbleToSelectExactly([context.entrenched, context.shield]);
                context.player1.clickCard(context.entrenched);
                expect(context.player2).toBeActivePlayer();
                expect(context.wampa).toHaveExactUpgradeNames(['shield']);
                expect(context.entrenched).toBeInZone('discard');

                context.player2.passAction();
                // Finn should be exhausted
                expect(context.finn).not.toHaveAvailableActionWhenClickedBy(context.player1);
            });
        });

        describe('Finn\'s deployed ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['entrenched'],
                        leader: { card: 'finn#this-is-a-rescue', deployed: true },
                        groundArena: [{ card: 'battlefield-marine', upgrades: ['jedi-lightsaber'] }],
                        resources: 5
                    },
                    player2: {
                        hand: ['top-target'],
                        groundArena: ['wampa', 'atst'],
                        resources: 5
                    }
                });
            });

            it('should defeat a friendly upgrade and give a shield token on attack', function () {
                const { context } = contextRef;

                const reset = (passAction = true) => {
                    context.finn.exhausted = false;
                    context.finn.damage = 0;
                    context.wampa.damage = 0;
                    if (passAction) {
                        context.player2.passAction();
                    }
                };

                // For all scenarios, ensure an opponent's upgrade is attached. We should
                // never be able to choose this upgrade for Finn's ability.
                context.player1.passAction();
                context.player2.clickCard(context.topTarget);
                context.player2.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['jedi-lightsaber', 'top-target']);

                // Scenario 1: Pass on defeating an upgrade on attack
                context.player1.clickCard(context.finn);
                context.player1.clickCard(context.wampa);
                context.player1.passAction();
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['jedi-lightsaber', 'top-target']);
                expect(context.wampa.damage).toBe(4);

                reset();

                // Scenario 2: Defeat a friendly upgrade on a friendly unit on attack
                context.player1.clickCard(context.finn);
                context.player1.clickCard(context.wampa);
                context.player1.clickPrompt('Defeat a friendly upgrade on a unit');
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['shield', 'top-target']);
                expect(context.jediLightsaber).toBeInZone('discard');
                expect(context.wampa.damage).toBe(4);

                reset();

                // Scenario 3: Defeat a friendly upgrade on an opponent's unit on attack
                // Attach a friendly upgrade to an opponent's unit
                context.player1.clickCard(context.entrenched);
                context.player1.clickCard(context.atst);
                expect(context.atst).toHaveExactUpgradeNames(['entrenched']);

                context.player2.passAction();

                // Attack with Finn
                context.player1.clickCard(context.finn);
                context.player1.clickCard(context.p2Base);
                context.player1.clickCard(context.entrenched);
                expect(context.player2).toBeActivePlayer();
                expect(context.atst).toHaveExactUpgradeNames(['shield']);
                expect(context.entrenched).toBeInZone('discard');
            });
        });
    });
});
