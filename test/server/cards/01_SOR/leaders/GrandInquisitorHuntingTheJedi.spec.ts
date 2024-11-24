describe('Grand Inquisitor, Hunting the Jedi', function() {
    integration(function(contextRef) {
        describe('Grand Inquisitor\'s leader undeployed ability', function() {
            beforeEach(function() {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['death-star-stormtrooper', 'scout-bike-pursuer', 'wampa'],
                        leader: 'grand-inquisitor#hunting-the-jedi',
                        resources: 4
                    },
                    player2: {
                        groundArena: ['battlefield-marine']
                    },
                });
            });

            it('should damage and ready a friendly unit with 3 power or less', function() {
                const { context } = contextRef;
                context.scoutBikePursuer.exhausted = true;

                // ready scout bike pursuer
                context.player1.clickCard(context.grandInquisitor);
                expect(context.player1).toBeAbleToSelectExactly([context.scoutBikePursuer, context.deathStarStormtrooper]);
                context.player1.clickCard(context.scoutBikePursuer);

                // check damage is applied
                expect(context.scoutBikePursuer.damage).toBe(2);
                expect(context.scoutBikePursuer.exhausted).toBeFalse();
                expect(context.player2).toBeActivePlayer();
            });

            it('should damage (and kill) a friendly unit with 3 power or less', function() {
                const { context } = contextRef;
                context.scoutBikePursuer.exhausted = true;
                context.wampa.exhausted = true;
                context.battlefieldMarine.exhausted = true;

                // try to ready death star stormtrooper but damage will kill it
                context.player1.clickCard(context.grandInquisitor);
                expect(context.player1).toBeAbleToSelectExactly([context.scoutBikePursuer, context.deathStarStormtrooper]);
                context.player1.clickCard(context.deathStarStormtrooper);

                // check stormtrooper is dead and no one is ready
                expect(context.deathStarStormtrooper.zoneName).toBe('discard');
                expect(context.battlefieldMarine.damage).toBe(0);
                expect(context.battlefieldMarine.exhausted).toBeTrue();
                expect(context.scoutBikePursuer.damage).toBe(0);
                expect(context.scoutBikePursuer.exhausted).toBeTrue();
                expect(context.wampa.damage).toBe(0);
                expect(context.wampa.exhausted).toBeTrue();
                expect(context.player2).toBeActivePlayer();
            });
        });

        describe('Grand Inquisitor\'s leader deployed ability', function() {
            beforeEach(function() {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['death-star-stormtrooper', 'scout-bike-pursuer', 'wampa'],
                        leader: { card: 'grand-inquisitor#hunting-the-jedi', deployed: true },
                    },
                    player2: {
                        groundArena: ['battlefield-marine']
                    },
                });
            });

            it('should damage and ready a friendly unit with 3 power or less', function() {
                const { context } = contextRef;
                context.scoutBikePursuer.exhausted = true;
                context.player1.clickCard(context.grandInquisitor);
                context.player1.clickCard(context.p2Base);

                expect(context.player1).toBeAbleToSelectExactly([context.scoutBikePursuer, context.deathStarStormtrooper]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.scoutBikePursuer);

                expect(context.scoutBikePursuer.damage).toBe(1);
                expect(context.scoutBikePursuer.exhausted).toBeFalse();
                expect(context.player2).toBeActivePlayer();
            });

            it('should damage (and kill) a friendly unit with 3 power or less', function() {
                const { context } = contextRef;
                context.scoutBikePursuer.exhausted = true;
                context.wampa.exhausted = true;
                context.battlefieldMarine.exhausted = true;
                context.player1.clickCard(context.grandInquisitor);
                context.player1.clickCard(context.p2Base);

                // try to ready death star stormtrooper but damage will kill it
                expect(context.player1).toBeAbleToSelectExactly([context.scoutBikePursuer, context.deathStarStormtrooper]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.deathStarStormtrooper);

                // check stormtrooper is dead and no one is ready
                expect(context.deathStarStormtrooper.zoneName).toBe('discard');
                expect(context.battlefieldMarine.damage).toBe(0);
                expect(context.battlefieldMarine.exhausted).toBeTrue();
                expect(context.scoutBikePursuer.damage).toBe(0);
                expect(context.scoutBikePursuer.exhausted).toBeTrue();
                expect(context.wampa.damage).toBe(0);
                expect(context.wampa.exhausted).toBeTrue();
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
