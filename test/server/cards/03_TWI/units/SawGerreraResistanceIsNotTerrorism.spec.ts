describe('Saw Gerrera, Resistance is Not Terrorism', function () {
    integration(function (contextRef) {
        describe('Saw Gerrera\'s ability', function () {
            it('should pay 2 resources to deal 2 damage to a unit', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['saw-gerrera#resistance-is-not-terrorism'],
                        base: { card: 'kestro-city', damage: 12 }
                    },
                    player2: {
                        groundArena: ['battlefield-marine', 'wampa'],
                        spaceArena: ['green-squadron-awing']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.sawGerrera);
                context.player1.clickCard(context.p2Base);

                // base do not have 15 damage : nothing should happen
                expect(context.battlefieldMarine.damage).toBe(0);
                expect(context.wampa.damage).toBe(0);
                expect(context.greenSquadronAwing.damage).toBe(0);
                expect(context.sawGerrera.damage).toBe(0);
                context.sawGerrera.exhausted = false;

                // deal damage to our base to reach 15
                context.player2.clickCard(context.battlefieldMarine);
                context.player2.clickCard(context.p1Base);

                // base have 15 damage, should deal 1 damage to each enemy ground unit
                context.player1.clickCard(context.sawGerrera);
                context.player1.clickCard(context.p2Base);

                expect(context.battlefieldMarine.damage).toBe(1);
                expect(context.wampa.damage).toBe(1);
                expect(context.greenSquadronAwing.damage).toBe(0);
                expect(context.sawGerrera.damage).toBe(0);
            });
        });
    });
});
