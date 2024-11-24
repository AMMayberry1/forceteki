describe('Bounty hunter\'s quarry', function () {
    integration(function (contextRef) {
        describe('Bounty hunter\'s quarry bounty ability', function () {
            const prompt = 'Bounty: Search the top 5 cards of your deck, or 10 cards instead if this unit is unique, for a unit that costs 3 or less and play it for free.';

            it('should prompt to choose a unit with a cost of 3 or less from the top 5 cards or top 10 cards (if unit is unique) and play it for free', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['scout-bike-pursuer', 'atst'],
                        groundArena: ['wampa'],
                        deck: ['sabine-wren#explosives-artist', 'battlefield-marine', 'waylay', 'protector', 'inferno-four#unforgetting', 'devotion', 'consular-security-force', 'echo-base-defender', 'swoop-racer', 'resupply', 'superlaser-technician'],
                        resources: 3
                    },
                    player2: {
                        groundArena: [{ card: 'specforce-soldier', upgrades: ['bounty-hunters-quarry'] }, { card: 'benthic-two-tubes#partisan-lieutenant', upgrades: ['bounty-hunters-quarry'] }]
                    }
                });

                const { context } = contextRef;

                // CASE 1: Defeating a non-unique unit should only allow the player to search the top 5 cards of their deck
                // kill bountied unit
                context.player1.clickCard(context.wampa);
                context.player1.clickCard(context.specforceSoldier);

                // use bounty
                expect(context.player1).toHavePassAbilityPrompt(prompt);
                context.player1.clickPrompt(prompt);
                expect(context.player1).toHaveEnabledPromptButtons([context.battlefieldMarine.title, context.infernoFour.title, context.sabineWren.title, 'Take nothing']);
                expect(context.player1).toHaveDisabledPromptButtons([context.waylay, context.protector.title]);
                context.player1.clickPrompt(context.battlefieldMarine.title);
                expect(context.battlefieldMarine).toBeInZone('groundArena');

                // unit should be free
                expect(context.player1.exhaustedResourceCount).toBe(0);

                expect(context.sabineWren).toBeInBottomOfDeck(context.player1, 4);
                expect(context.waylay).toBeInBottomOfDeck(context.player1, 4);
                expect(context.infernoFour).toBeInBottomOfDeck(context.player1, 4);
                expect(context.protector).toBeInBottomOfDeck(context.player1, 4);

                context.wampa.exhausted = false;
                context.player2.passAction();

                // CASE 2: Defeating a unique unit should allow the player to search the top 10 cards of their deck
                // kill bountied unit
                context.player1.clickCard(context.wampa);
                context.player1.clickCard(context.benthicTwoTubes);

                // use bounty
                expect(context.player1).toHavePassAbilityPrompt(prompt);
                context.player1.clickPrompt(prompt);
                expect(context.player1).toHaveEnabledPromptButtons([context.sabineWren.title, context.infernoFour.title, context.superlaserTechnician.title, context.echoBaseDefender.title, context.swoopRacer.title, 'Take nothing']);
                expect(context.player1).toHaveDisabledPromptButtons([context.devotion.title, context.waylay, context.protector.title, context.consularSecurityForce.title, context.resupply.title]);
                context.player1.clickPrompt(context.sabineWren.title);
                expect(context.sabineWren).toBeInZone('groundArena');
                expect(context.infernoFour).toBeInBottomOfDeck(context.player1, 9);
                expect(context.protector).toBeInBottomOfDeck(context.player1, 9);
                expect(context.superlaserTechnician).toBeInBottomOfDeck(context.player1, 9);
                expect(context.waylay).toBeInBottomOfDeck(context.player1, 9);
                expect(context.consularSecurityForce).toBeInBottomOfDeck(context.player1, 9);
                expect(context.resupply).toBeInBottomOfDeck(context.player1, 9);
                expect(context.swoopRacer).toBeInBottomOfDeck(context.player1, 9);
                expect(context.echoBaseDefender).toBeInBottomOfDeck(context.player1, 9);
                expect(context.devotion).toBeInBottomOfDeck(context.player1, 9);

                // unit should be free
                expect(context.player1.exhaustedResourceCount).toBe(0);
            });
        });
    });
});
