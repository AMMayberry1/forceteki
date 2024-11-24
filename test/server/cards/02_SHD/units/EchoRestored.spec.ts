describe('Echo, Restored', function () {
    integration(function (contextRef) {
        describe('Echo\'s ability', function () {
            const prompt = 'Discard a card from your hand. Give 2 Experience tokens to a unit in play with the same name as the discarded card.';
            it('can discard a card and give 2 experience tokens to a unit with same name', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['echo#restored', 'luke-skywalker#jedi-knight', 'wampa', 'battlefield-marine', 'atst'],
                        groundArena: ['battlefield-marine', 'wampa'],
                        leader: { card: 'luke-skywalker#faithful-friend', deployed: true },
                    },
                    player2: {
                        groundArena: ['wampa'],
                    }
                });

                const { context } = contextRef;

                function reset() {
                    context.player1.moveCard(context.echo, 'hand');
                    context.player2.passAction();
                }

                // find duplicates
                const handLuke = context.player1.findCardByName('luke-skywalker#jedi-knight', 'hand');
                const leaderLuke = context.player1.findCardByName('luke-skywalker#faithful-friend', 'groundArena');
                const handBattlefieldMarine = context.player1.findCardByName('battlefield-marine', 'hand');
                const groundBattlefieldMarine = context.player1.findCardByName('battlefield-marine', 'groundArena');
                const handWampa = context.player1.findCardByName('wampa', 'hand');
                const friendlyGroundWampa = context.player1.findCardByName('wampa', 'groundArena');
                const enemyGroundWampa = context.player2.findCardByName('wampa', 'groundArena');

                // play echo
                context.player1.clickCard(context.echo);

                // discard a card
                expect(context.player1).toHavePassAbilityPrompt(prompt);
                context.player1.clickPrompt(prompt);

                // can discard any cards
                expect(context.player1).toBeAbleToSelectExactly([handLuke, handBattlefieldMarine, handWampa, context.atst]);
                context.player1.clickCard(context.atst);

                // discarded card have no unit in play with same title, nothing happen
                expect(context.player2).toBeActivePlayer();
                expect(context.atst).toBeInZone('discard');

                expect(leaderLuke.isUpgraded()).toBeFalse();
                expect(groundBattlefieldMarine.isUpgraded()).toBeFalse();
                expect(enemyGroundWampa.isUpgraded()).toBeFalse();
                expect(friendlyGroundWampa.isUpgraded()).toBeFalse();
                expect(context.echo.isUpgraded()).toBeFalse();

                reset();

                // play echo
                context.player1.clickCard(context.echo);
                context.player1.clickPrompt(prompt);
                context.player1.clickCard(handLuke);

                // luke was discarded, leader luke should have 2 experiences tokens
                expect(context.player2).toBeActivePlayer();
                expect(handLuke).toBeInZone('discard');

                expect(leaderLuke).toHaveExactUpgradeNames(['experience', 'experience']);
                expect(groundBattlefieldMarine.isUpgraded()).toBeFalse();
                expect(friendlyGroundWampa.isUpgraded()).toBeFalse();
                expect(enemyGroundWampa.isUpgraded()).toBeFalse();
                expect(context.echo.isUpgraded()).toBeFalse();

                reset();

                // play echo
                context.player1.clickCard(context.echo);
                context.player1.clickPrompt(prompt);
                context.player1.clickCard(handWampa);

                // 2 units with the same title, can choose between them
                expect(context.player1).toBeAbleToSelectExactly([friendlyGroundWampa, enemyGroundWampa]);
                expect(context.player1).not.toHaveChooseNoTargetButton();
                context.player1.clickCard(friendlyGroundWampa);

                // friendly wampa should have 2 experiences tokens
                expect(context.player2).toBeActivePlayer();
                expect(handWampa).toBeInZone('discard');

                expect(leaderLuke).toHaveExactUpgradeNames(['experience', 'experience']);
                expect(friendlyGroundWampa).toHaveExactUpgradeNames(['experience', 'experience']);
                expect(enemyGroundWampa.isUpgraded()).toBeFalse();
                expect(groundBattlefieldMarine.isUpgraded()).toBeFalse();
                expect(context.echo.isUpgraded()).toBeFalse();
            });
        });
    });
});
