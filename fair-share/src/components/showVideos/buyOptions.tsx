import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { getPrices } from "@/hooks/videoDetails/getPrices";

interface BuyOptionsProps {
  videoCreator: any;
  videoReactor: any;
}

export const BuyOptions = ({ videoCreator, videoReactor }: BuyOptionsProps) => {
  const prices = getPrices(videoReactor, videoCreator);
  return (
    <div className="video-details-right flex flex-col w-full">
      <FieldSet className="w-full max-w-xs">
        <FieldLegend variant="label">Subscription Plan</FieldLegend>
        <FieldDescription>
          Yearly and lifetime plans offer significant savings.
        </FieldDescription>
        <RadioGroup defaultValue="monthly">
          <Field orientation="horizontal">
            <RadioGroupItem value="monthly" id="plan-monthly" />
            <FieldLabel htmlFor="plan-monthly" className="font-normal">
              Einmalzahlung {prices.oneTime.toFixed(2)} €
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="yearly" id="plan-yearly" />
            <FieldLabel htmlFor="plan-yearly" className="font-normal">
              PayPer 1000 Views {prices.payPerViews.toFixed(2)} €
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="lifetime" id="plan-lifetime" />
            <FieldLabel htmlFor="plan-lifetime" className="font-normal">
              PayPer CPM {prices.payPerCpm.toFixed(2)} €
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
      <Button>Buy</Button>
    </div>
  )
}