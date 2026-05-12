"use client";

interface RoomData {
  roomId: string;
  peopleCount: number;
  temperature: number;
  humidity: number;
  roomStatus: string;
}

interface Props {
  rooms: RoomData[];
}

export default function RoomTable({
  rooms,
}: Props) {

  return (
    <div className="
      bg-white rounded-2xl
      border border-slate-200
      overflow-hidden
    ">

      <div className="px-6 py-5 border-b">
        <h2 className="
          text-lg font-black
          text-slate-800
        ">
          Detail Ruangan
        </h2>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-50">

            <tr>

              <th className="px-6 py-3 text-left">
                Room
              </th>

              <th className="px-6 py-3 text-left">
                Students
              </th>

              <th className="px-6 py-3 text-left">
                Temp
              </th>

              <th className="px-6 py-3 text-left">
                Humidity
              </th>

              <th className="px-6 py-3 text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {rooms.map((room, index) => (

              <tr
                key={index}
                className="border-t"
              >

                <td className="px-6 py-4">
                  {room.roomId}
                </td>

                <td className="px-6 py-4">
                  {room.peopleCount}
                </td>

                <td className="px-6 py-4">
                  {room.temperature}°C
                </td>

                <td className="px-6 py-4">
                  {room.humidity}%
                </td>

                <td className="px-6 py-4">

                  <span className="
                    px-2 py-1 rounded-full
                    bg-emerald-100
                    text-emerald-700
                    text-xs font-bold
                  ">
                    {room.roomStatus}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}