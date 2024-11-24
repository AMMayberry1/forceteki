describe('Krayt Dragon', function () {
    integration(function (contextRef) {
        describe('Krayt Dragon\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['battlefield-marine'],
                        groundArena: ['krayt-dragon'],
                    },
                    player2: {
                        hand: ['superlaser-blast', 'privateer-crew', 'green-squadron-awing'],
                        groundArena: ['wampa'],
                        resources: ['hotshot-dl44-blaster', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst', 'atst']
                    }
                });
            });

            it('should deal damage to ground unit or base when enemy play a card', function () {
                const { context } = contextRef;

                // play a card, nothing happen
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.player2).toBeActivePlayer();

                // enemy play a space unit, should deal damage to ground unit or base
                context.player2.clickCard(context.greenSquadronAwing);
                expect(context.player1).toBeAbleToSelectExactly([context.p2Base, context.wampa]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);
                expect(context.wampa.damage).toBe(2);

                // enemy play a ground unit, should deal damage to ground unit or base
                context.player1.passAction();
                context.player2.clickCard(context.privateerCrew);

                // should choose which player resolve their triggers first
                context.player2.clickPrompt('You');
                expect(context.player1).toBeAbleToSelectExactly([context.p2Base, context.wampa, context.privateerCrew]);
                context.player1.clickCard(context.p2Base);
                expect(context.p2Base.damage).toBe(2);

                // for smuggle, should take the printed cost
                context.setDamage(context.p2Base, 0);
                context.player1.passAction();
                context.player2.clickCard(context.hotshotDl44Blaster);
                // resolve hotshot blaster first
                context.player2.clickCard(context.wampa);
                context.player2.clickPrompt('You');
                context.player2.clickCard(context.p1Base);

                // 1 damage on base (3 paid from smuggle but 1 for printed cost)
                expect(context.player1).toBeAbleToSelectExactly([context.p2Base, context.wampa, context.privateerCrew]);
                context.player1.clickCard(context.p2Base);
                expect(context.p2Base.damage).toBe(1);

                context.setDamage(context.p2Base, 0);
                // enemy kill everyone, krayt ability still activates
                context.player1.passAction();
                context.player2.clickCard(context.superlaserBlast);
                expect(context.player1).toHavePassAbilityPrompt('Deal damage equal to that card’s cost to their base or a ground unit they control');
                context.player1.clickPrompt('Deal damage equal to that card’s cost to their base or a ground unit they control');
                expect(context.p2Base.damage).toBe(8);
            });
            // TODO test u-wing, vader or endless legion when implemented
        });
    });
});
