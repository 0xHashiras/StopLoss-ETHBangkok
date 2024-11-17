import { FC } from "react";
import Lottie from "lottie-react"; // Lottie component

interface AnimatedLoaderProps {
  animatedData: any; // Lottie animation data
}

const AnimatedLoader: FC<AnimatedLoaderProps> = ({ animatedData }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Lottie
        animationData={animatedData}
        style={{ height: 200, width: 200 }} // You can adjust the size here
      />
    </div>
  );
};

export default AnimatedLoader;
