import { ZoneName } from '../../../../../server/game/core/Constants';

describe('Frontier Trader', function() {
    integration(function(contextRef) {
        describe('Frontier Trader\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['frontier-trader'],
                        deck: ['wampa', 'battlefield-marine', 'atst', 'atst'],
                        resources: [
                            'armed-to-the-teeth',
                            'covert-strength',
                            'chewbacca#pykesbane',
                            'battlefield-marine',
                            'atst',
                            'collections-starhopper',
                        ],
                        base: 'chopper-base'
                    },
                    player2: {
                        resources: ['death-trooper', 'occupier-siege-tank']
                    }
                });
            });

            it('should be able to take resource back to hand and replace it with top card from deck', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.frontierTrader);
                expect(context.player1).toHavePassAbilityButton();
                // Should be able to select only player1 resources
                expect(context.player1).toBeAbleToSelectExactly([
                    'armed-to-the-teeth',
                    'covert-strength',
                    'chewbacca#pykesbane',
                    'battlefield-marine',
                    'atst',
                    'collections-starhopper'
                ]);
                context.player1.clickCard(context.collectionsStarhopper);
                expect(context.player1).toHavePassAbilityPrompt('Put the top card of your deck into play as a resource.');
                context.player1.clickPrompt('Put the top card of your deck into play as a resource.');
                expect(context.collectionsStarhopper).toBeInZone(ZoneName.Hand);
                expect(context.wampa).toBeInZone(ZoneName.Resource);
            });
        });
    });
});
