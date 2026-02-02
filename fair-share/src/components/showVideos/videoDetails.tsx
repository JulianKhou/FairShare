import { CloseBtn } from "../utility/closeBtn";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useVideoDetails } from "../../hooks/videoDetails/useVideoDetails";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
interface VideoDetailsProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  mode?: "owner" | "public";
}
const videoDetailCss =
  "video-details flex  justify-between fixed top-4/7 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5/6 h-4/5 bg-card rounded-2xl p-2 ";
export const VideoDetails = ({
  video,
  isOpen,
  onClose,
  mode,
}: VideoDetailsProps) => {
  if (!isOpen) return null;
  const { isLicensed, toggleLicense } = useVideoDetails(video);
  return (
    <div className={videoDetailCss} onClick={(e) => e.stopPropagation()}>
      <div className="video-details-left">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-fit h-fit object-cover rounded-2xl p-2"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col ml-3">
          <h1>{video.title}</h1>
          <h2 className="text-muted-foreground self-start text-xs ">
            {video.last_view_count} Views
          </h2>
        </div>
      </div>
      {mode === "owner" ? (
        <div className="video-details-right flex flex-col w-full">
          <Field orientation="horizontal" className="max-w-sm">
            <FieldContent>
              <FieldLabel htmlFor="switch-focus-mode">
                License for commercial use
              </FieldLabel>
              <FieldDescription>
                License the video for commercial use
              </FieldDescription>
            </FieldContent>
            <Switch onCheckedChange={toggleLicense} checked={isLicensed} />
          </Field>
        </div>
      ) : mode === "public" ? (
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
                  Einmalzahlung
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="yearly" id="plan-yearly" />
                <FieldLabel htmlFor="plan-yearly" className="font-normal">
                  PayPer 1000 Views
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="lifetime" id="plan-lifetime" />
                <FieldLabel htmlFor="plan-lifetime" className="font-normal">
                  PayPer CPM
                </FieldLabel>
              </Field>
            </RadioGroup>
          </FieldSet>
          <Button>Buy</Button>
        </div>
      ) : null}
      <CloseBtn onClose={onClose} />
    </div>
  );
};
